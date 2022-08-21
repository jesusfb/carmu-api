import { Request, Response } from 'express';
import { destroyResource } from 'src/middleware/formData';
import CategoryModel from 'src/models/Category.model';
import { StoreCategoryRequest, UpdateCategoryRequest } from 'src/types';
import NotFoundError from 'src/utils/errors/NotFoundError';
import sendError from 'src/utils/sendError';

export async function list(_req: Request, res: Response) {
  try {
    const categories = await CategoryModel.find().sort('order level');
    res.status(200).json({ categories });
  } catch (error) {
    sendError(error, res);
  }
}

/**
 * Create a new category of level 0
 * @param req
 * @param res
 */
export async function store(req: Request, res: Response) {
  const { name, description, image }: StoreCategoryRequest = req.body;
  try {
    // get the count of category in databse
    const count = await CategoryModel.where('level', 0).count();

    // create a new category
    const category = await CategoryModel.create({
      name,
      description,
      image,
      order: count + 1,
    });

    res.status(201).json({ category });
  } catch (error) {
    if (image) await destroyResource(image.publicId);
    sendError(error, res);
  }
}

export async function show(req: Request, res: Response) {
  const { categoryId } = req.params;
  try {
    const category = await CategoryModel.findById(categoryId).populate('mainCategory').populate('subcategories');
    if (!category) throw new NotFoundError('Categoría no encontrada');

    res.status(200).json({ category });
  } catch (error) {
    sendError(error, res);
  }
}

export async function update(req: Request, res: Response) {
  const { name, description, image, isEnabled, order: reqOrder }: UpdateCategoryRequest = req.body;
  const order = Number(reqOrder);
  const { categoryId } = req.params;
  try {
    const category = await CategoryModel.findById(categoryId);
    if (!category) throw new NotFoundError('Categoría no encontrada.');

    if (name !== category.name) category.name = name;
    category.description = description;
    category.isEnabled = isEnabled ? isEnabled === 'true' : false;

    // update order
    if (!isNaN(order) && category.order !== order) {
      await CategoryModel.updateMany({ mainCategory: category.mainCategory }, { $inc: { order: -1 } })
        .where('order')
        .gt(category.order);

      const max = await CategoryModel.count().where('mainCategory', category.mainCategory);
      if (order < max) {
        await CategoryModel.updateMany({ mainCategory: category.mainCategory }, { $inc: { order: 1 } })
          .where('_id')
          .ne(category._id)
          .where('order')
          .gte(order);
      }

      category.order = order <= max ? order : max;
    }

    const lastImage = category.image;
    if (image) category.image = image;

    await category.save({ validateModifiedOnly: true });
    if (image && lastImage) await destroyResource(lastImage.publicId);

    res.status(200).json({ category });
  } catch (error) {
    if (image) await destroyResource(image.publicId);
    sendError(error, res);
  }
}

export async function destroy(_req: Request, res: Response) {
  try {
    //
  } catch (error) {
    sendError(error, res);
  }
}
